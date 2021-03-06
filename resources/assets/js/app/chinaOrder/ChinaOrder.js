import React, {Component} from 'react';
import {connect} from "react-redux";
import _ from 'lodash';
import {bindActionCreators} from "redux";

import ApiService from "../../services/ApiService";
import Paginate from "../common/Paginate";
import * as themeActions from "../../theme/meta/action";
import * as commonActions from "../common/meta/action";
import Constant from './meta/constant';
import Card from "../../theme/components/Card";
import ActionButtons from "./components/ActionButtons";
import SearchForm from "./components/SearchForm";
import FormCreate from "./components/FormCreate";
import Layout from "../../theme/components/Layout";
import PaginationPageSize from "../common/PaginationPageSize";
import {Link, Redirect} from "react-router-dom";
import Formatter from "../../helpers/Formatter";
import moment from "moment/moment";
import ForbiddenPage from "../common/ForbiddenPage";


class ChinaOrder extends Component {

    constructor(props) {
        super(props);

        this.state = {
            models: [],
            meta: {pageCount: 0, currentPage: 1},
            isLoading: true,
            redirectToDetailId: null, // redirect to detail page after insert new ChinaOrder
        };
    }

    componentDidMount() {
        this.fetchData();

        this.props.actions.changeThemeTitle("Đơn hàng TQ");
    }

    componentWillReceiveProps(nextProps) {
        this.fetchData(nextProps.search);
    }

    componentWillUnmount() {
        this.props.actions.clearState();
    }

    fetchData(search) {
        search = search || this.props.search;

        const params = _.assign({}, search.params, search.meta);

        this.setState({isLoading: true});

        return ApiService.get(Constant.resourcePath(), params).then(({data: {data}}) => {
            this.setState({
                models: data.data,
                meta: {
                    pageCount: data.last_page,
                    currentPage: data.current_page
                },
                isLoading: false,
            });
        });
    }

    render() {
        const {userPermissions} = this.props;
        if (!userPermissions.china_order || !userPermissions.china_order.index) return <ForbiddenPage/>;

        if (this.state.redirectToDetailId) {
            return <Redirect to={"/china-order/" + this.state.redirectToDetailId}/>;
        }

        const defaultPageSize = this.props.search.meta.per_page;

        const listRows = this.state.models.map(model => {
            return (
                <tr key={model.id}>
                    <td><Link to={"/china-order/" + model.id}>{model.id}</Link></td>
                    <td>{_.get(model, 'user_purchasing.name')}</td>
                    <td>
                        ￥{Formatter.money(model.china_order_items.map(item => item.total_price).reduce((a, b) => a + b, 0))}
                    </td>
                    <td>{moment(model.created_at).format("DD/MM/YYYY")}</td>
                    <td>{!!model.end_date && moment(model.end_date).format("DD/MM/YYYY")}</td>
                    <td>{model.status_name}</td>
                    <td className="column-actions pl-0 pr-0">
                        <ActionButtons model={model} setListState={this.setState.bind(this)}/>
                    </td>
                </tr>
            );
        });

        return (
            <Layout>

                <Card>
                    <SearchForm/>
                </Card>

                <Card isLoading={this.state.isLoading}>

                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>NV đặt hàng</th>
                                <th>Tổng thanh toán</th>
                                <th>Ngày tạo</th>
                                <th>Ngày kết thúc</th>
                                <th>Trạng thái</th>
                                <th style={{width: '114px'}} className="pl-0 pr-0">
                                    {userPermissions.china_order.create &&
                                    <button className="btn btn-primary btn-sm btn-block" onClick={() => {
                                        this.props.actions.openMainModal(<FormCreate onInsertSuccess={(data) => {
                                            this.setState({redirectToDetailId: data.id});
                                        }} setListState={this.setState.bind(this)}/>, "Thêm Đơn hàng mới");
                                    }}><i className="ft-plus"/> Thêm
                                    </button>}
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {listRows}
                            </tbody>
                        </table>
                    </div>
                    <div className="row">
                        <div className="col-sm-8">
                            <Paginate
                                pageCount={this.state.meta.pageCount}
                                onPageChange={(data) => {
                                    this.props.actions.changePage(data.selected + 1);
                                }}
                                currentPage={this.state.meta.currentPage - 1}
                            />
                        </div>
                        <div className="col-sm-4 text-right mt-1">
                            Hiển thị mỗi trang <PaginationPageSize
                            defaultPageSize={defaultPageSize}
                            onChange={(pageSize) => {
                                this.props.actions.changePageSize(pageSize);
                            }}/> bản ghi
                        </div>
                    </div>
                </Card>

            </Layout>
        );
    }
}

function mapStateToProps(state) {
    return {
        search: state.chinaOrder.search,
        userPermissions: state.auth.permissions,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(_.assign({}, commonActions, themeActions), dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ChinaOrder)
